import Vue from 'vue'
import Router from 'vue-router'
import MenuView from '@/views/common/MenuView'
import PageView from '@/views/common/PageView'
import LoginView from '@/views/login/Common'
import EmptyPageView from '@/views/common/EmptyPageView'
import HomePageView from '@/views/HomePage'
import db from 'utils/localstorage'
import {getDemoMenu} from '@/demo/menu'

Vue.use(Router)

const constRouter = [
  {path: '/login', name: 'Login', component: LoginView},
  {path: '/index', name: 'Home', redirect: '/app/dashboard'}
]

const router = new Router({routes: constRouter})
const whiteList = ['/login']
let asyncRouter

router.beforeEach((to, from, next) => {
  if (whiteList.indexOf(to.path) !== -1) {
    next()
    return
  }

  const token = db.get('USER_TOKEN', '')
  const user = db.get('USER', null)
  const storedRouter = get('USER_ROUTER')
  if (!token || !user) {
    next('/login')
    return
  }

  if (asyncRouter) {
    next()
    return
  }

  asyncRouter = storedRouter || getDemoMenu(user.roleCode)
  save('USER_ROUTER', asyncRouter)
  go(to, next)
})

function go (to, next) {
  const routes = filterAsyncRouter(JSON.parse(JSON.stringify(asyncRouter)))
  router.addRoutes(routes)
  next({...to, replace: true})
}

function save (name, data) {
  localStorage.setItem(name, JSON.stringify(data))
}

function get (name) {
  const value = localStorage.getItem(name)
  return value ? JSON.parse(value) : null
}

function filterAsyncRouter (routes) {
  return routes.filter((route) => {
    if (!route.component) return false
    switch (route.component) {
      case 'MenuView':
        route.component = MenuView
        break
      case 'PageView':
        route.component = PageView
        break
      case 'EmptyPageView':
        route.component = EmptyPageView
        break
      case 'HomePageView':
        route.component = HomePageView
        break
      default:
        route.component = view(route.component)
    }
    if (route.children && route.children.length) route.children = filterAsyncRouter(route.children)
    return true
  })
}

function view (path) {
  const demoPath = path.indexOf('demo/') === 0 ? path.substring(5) : path
  return function (resolve) {
    import(`@/views/demo/${demoPath}.vue`).then(mod => resolve(mod))
  }
}

export default router
