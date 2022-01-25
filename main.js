class Memory{
  constructor(length){
    this.memory = new Array(length).fill(0);
    this.load();
  }

  allocate(n, c){}

  free(p){}

  read(p, i){
    return this.memory[p+i];
  }

  write(p, i, c){
    this.memory[p+i] = c;
  }

  fill(p, i, c){
    for(let j = p; j < p + i; j++){
      this.memory[j] = c;
    }
  }

  load(){}
}



class Dumby extends Memory{
  constructor(length){
    super(length);
  }

  allocate(n, c){
    const i = this.read(0, 0);
    this.fill(i, n, c);
    this.write(0, 0, i + n);
    return i;
  }

  free(p){
    return;
  }

  load(){
    this.write(0, 0, 1);
  }
}

class Fixed extends Memory{
  constructor(length, blockLength){
    super(length);
    this.blockLength = blockLength;
  }

  readNext(){
    return this.memory[0];
  }

  writeNext(p){
    this.memory[0] = p;
  }

  isAllocated(p){
    return this.memory[p - 1] == 1;
  }

  isFree(p){
    return this.memory[p - 1] == 0;
  }

  markAllocated(p){
    this.memory[p - 1] = 1;
  }

  markFree(p){
    this.memory[p - 1] = 0;
  }

  allocate(n, c){
    if(n > this.blockLength){
      return null;
    }
    let p = 2;
    while(p <= this.readNext() && this.isAllocated(p)){
      p += this.blockLength;
    }
    this.markAllocated(p);
    this.fill(p, n, c);
    if(p > this.readNext()){
      this.writeNext(p);
    }
    return p;
  }

  free(p){
    this.markFree(p);
  }

  load(){
    this.write(0, 0, 2);
  }
}

class Header extends Memory{
  constructor(length){
    super(length);
  }

  isAllocated(p){
    return this.memory[p - 1] % 2 == 1;
  }

  isFree(p){
    return this.memory[p - 1] % 2 == 0;
  }

  markAllocated(p, length){
    const num = length + 1;
    this.memory[p - 1] = num;
    this.memory[p + length] = num;
  }

  markFree(p, length){
    const num = length;
    this.memory[p - 1] = num;
    this.memory[p + length] = num;
  }

  readLength(p){
    return 2 * (Math.floor(this.memory[p - 1] / 2))
  }

  readPreviousLength(p){
    return 2 * (Math.floor(this.memory[p - 2] / 2))
  }

  isPreviousFree(p){
    return this.memory[p - 2] % 2 == 0;
  }

  isPreviousAllocated(p){
    return this.memory[p - 2] % 2 == 1;
  }

  readEpilogue(){
    return this.memory[0];
  }

  writeEpilogue(p){
    this.memory[0] = p;
  }

  allocate(n, c){
    let p = 2;
    let nn = Math.ceil(n/2)*2;
    while(this.isAllocated(p)){
      p += this.readLength(p) + 2;
      if(p == this.readEpilogue()){
        this.markFree(p, 0);
        this.markAllocated(p + nn + 2, 0);
        this.writeEpilogue(p + nn + 2);
      }
    }
    if(this.readLength(p) > nn){
      this.markFree(p + nn + 2, this.readLength(p) - nn - 2);
    }
    this.markAllocated(p, nn);
    this.fill(p, n, c);
    return p
  }

  free(p){
    this.markFree(p, this.readLength(p))
    if(this.isFree(p + this.readLength(p) + 2)){
      this.markFree(p, this.readLength(p) + this.readLength(p + this.readLength(p) + 2));
    }
    if(this.isPreviousFree(p)){
      this.markFree(p - this.readPreviousLength(p) - 2, this.readPreviousLength(p) + this.readLength(p) + 2);
    }
  }

  load(){
    this.markAllocated(2, 0);
    this.markAllocated(4, 0);
    this.write(0, 0, 4);
  }
}

class HeaderWithExplicits extends Memory{
  constructor(length){
    super(length);
  }

  readStartingChain(){
    return this.memory[1];
  }

  writeStartingChain(p){
    this.memory[1] = p;
  }

  readPrevious(p){
    return this.read(p, 0);
  }

  writeNext(p){
    return this.read(p, 1);
  }

  writePrevious(p, previous){
    this.write(p, 0, previous);
  }

  writeNext(p, next){
    this.write(p, 1, next);
  }

  isChainEmpty(){
    return this.readStartingChain()==0;
  }

  addStartingChain(p){
    this.writePrevious(this.readStartingChain(), p);
    this.writeNext(p, this.readStartingChain());
    this.writePrevious(p, 0);
    this.writeStartingChain(p);
  }

  removeInChain(p){
    this.writeNext(this.readPrevious(p), this.readNext(p));
    this.writePrevious(this.readNext(p), this.readPrevious(p));
  }


}

let a = new Header(60)
let b = a.allocate(7, "ihi")
let c = a.allocate(8, "iazeazazeaezaezihi")
let d = a.allocate(6, "iahi")
let e = a.allocate(4, "zzzzzzzziahi")
a.free(c)
a.free(d);
let f = a.allocate(5, "....")
