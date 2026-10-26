import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/pages/home/ui/HomePagina.vue'
import Adotar from '@/pages/adotar/ui/AdotarPagina.vue'
import Ong from '@/pages/ong/ui/OngPagina.vue'
import Animais from '@/pages/animais/ui/AnimaisPagina.vue'
import login from '@/pages/login/ui/LoginPagina.vue'
import CadastroUsuario from '@/pages/cadastroUsuario/ui/CadastroUsuarioPagina.vue'
import Perfil from '@/pages/perfilUsuario/ui/PerfilUsuarioPagina.vue'
import Admin from '@/pages/painelAdm/ui/PainelAdm.vue'

const router = createRouter({
  history: createWebHistory(),

  routes: [
    
    { path: "/", 
    name: "Home",
    component: Home 
    },
    { path: "/adotar/:id", 
    name: "Adotar",
    component: Adotar,
    props: true
  },
  {
    path: "/ong",
    name: "Ong",
    component: Ong,
  },
  { 
    path: "/login", 
    name: "login", 
    component: login
   },
  {
    path: "/cadastro",
    name: "cadastro",
    component: CadastroUsuario
  },
  {
    path: "/animais",
    name: "animais",
    component: Animais,
  },
  { 
    path: "/perfil", 
    name: "perfil", 
    component: Perfil 
  },
  { path: "/admin", 
    name: "Admin", 
    component: Admin 
  }
  ],
})

export default router