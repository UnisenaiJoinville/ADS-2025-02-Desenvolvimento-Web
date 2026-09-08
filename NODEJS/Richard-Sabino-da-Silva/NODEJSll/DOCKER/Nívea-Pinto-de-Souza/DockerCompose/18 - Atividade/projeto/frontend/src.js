import { createApp, ref, onMounted } from 'vue';
const App = {setup(){const status=ref('carregando');const data=ref([]);onMounted(async()=>{try{const r=await fetch('http://localhost:3000/messages');const j=await r.json();data.value=j.data;status.value='ok';}catch(e){status.value=e.message;}});return{status,data}},template:`<main style="font-family:Arial;max-width:700px;margin:40px auto"><h1>Cenário 1</h1><p>Status: {{status}}</p><ul><li v-for="m in data" :key="m.id">{{m.text}}</li></ul></main>`};
createApp(App).mount('#app');
