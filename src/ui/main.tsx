// Canvas-only production entry. Editors are local development tools.
if(process.env.NODE_ENV==='development'){
 import('cssstudio').then(({startStudio})=>startStudio());
}
export {};
