import {
  createRouter,
  createWebHistory,
} from 'vue-router'

import HomePage from '@/pages/home/ui/HomePage.vue'
import PetsPage from '@/pages/pets/ui/SinglePets.vue'
import AdoptionPage from '@/pages/adoption/ui/AdoptionPage.vue'
import LoginPage from '@/pages/login/ui/LoginPage.vue'

const router = createRouter({
  history: createWebHistory(),

  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/pets',
      name: 'pets',
      component: PetsPage,
    },
    {
      path: '/adoption',
      name: 'adoption',
      component: AdoptionPage,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
  ],
})

export default router