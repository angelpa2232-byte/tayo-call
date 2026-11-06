// Keep physical key state independently of rerenders and game round changes.
export class PressGate {
 constructor(){this.held=new Set();}
 press(code,repeat=false){if(repeat||this.held.has(code)){this.held.add(code);return false;}this.held.add(code);return true;}
 release(code){return this.held.delete(code);}
 reset(){this.held.clear();}
}
