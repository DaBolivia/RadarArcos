const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');

const data = JSON.parse(
  fs.readFileSync('dist/data.json', 'utf8')
);

let content = '';

const element = {
  classList: {
    toggle() {}
  },
  querySelector() {
    return null;
  },
  focus() {},
  get innerHTML() {
    return content;
  },
  set innerHTML(value) {
    content = value;
  }
};

const ctx = {
  URL,
  URLSearchParams,
  console,

  // Impede chamadas de rede durante o teste.
  // Os dados locais são carregados diretamente abaixo.
  fetch: () => new Promise(() => {}),

  document: {
    currentScript: {
      src: 'https://example.org/app.js'
    },
    querySelector: () => element,
    querySelectorAll: () => [],
    getElementById: () => element
  },

  window: {
    scrollTo() {},
    addEventListener() {}
  },

  location: {
    hash: '',
    href: 'https://example.org'
  },

  navigator: {},
  DATA: data
};

vm.createContext(ctx);

const code = fs.readFileSync('dist/app.js', 'utf8');

vm.runInContext(code + '\nD = DATA;', ctx);

const calls = [
  'home()',
  'people()',
  'proposals(new URLSearchParams())',
  "proposals(new URLSearchParams('q=zzzzxxx'))",
  'sessions(new URLSearchParams())',
  'about()',
  ...data.people.map(p => `profile(${p.id})`),
  ...data.sessions.map(s => `sessionDetail(${s.id})`),
  ...data.materials.map(m => `detail(${m.id})`)
];

for (const call of calls) {
  vm.runInContext(call, ctx);

  assert(content.length > 50, call);
  assert(!content.includes('undefined'), call);
}

vm.runInContext(
  "proposals(new URLSearchParams('q=zzzzxxx'))",
  ctx
);

assert(content.includes('Nenhuma matéria encontrada'));

vm.runInContext(
  "proposals(new URLSearchParams('ano=2025'))",
  ctx
);

// Aceita espaços e quebras de linha na opção selecionada.
assert(
  /selected\s*>\s*2025\s*<\/option>/.test(content)
);

vm.runInContext(
  "proposals(new URLSearchParams('q=%3Cscript%3E'))",
  ctx
);

assert(!content.includes('<script>'));
assert(content.includes('&lt;script&gt;'));

console.log(
  'OK: renderização de todas as matérias, sessões, perfis, filtros, estado vazio e escape de HTML.'
);
