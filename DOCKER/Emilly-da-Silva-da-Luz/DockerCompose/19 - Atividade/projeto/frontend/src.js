import { createApp, ref, onMounted } from 'vue';
const App={setup(){const books=ref([]); const load=async()=>{books.value=(await (await fetch('http://localhost:3001/books')).json()).data}; onMounted(load); return{books,load}},template:`<main><h1>Catálogo de livros</h1><button @click="load">Atualizar</button><ul><li v-for="b in books" :key="b.id">{{b.title}}</li></ul></main>`};
createApp(App).mount('#app');
