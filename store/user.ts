import { defineStore } from 'pinia'

interface UserState {
  id: string | null
  name: string | null
  email: string | null
  isAuthenticated: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    id: null,
    name: null,
    email: null,
    isAuthenticated: false
  }),

  getters: {
    getUserInfo: (state) => ({
      id: state.id,
      name: state.name,
      email: state.email
    })
  },

  actions: {
    setUser(user: Partial<UserState>) {
      this.id = user.id ?? this.id
      this.name = user.name ?? this.name
      this.email = user.email ?? this.email
      this.isAuthenticated = true
    },

    clearUser() {
      this.id = null
      this.name = null
      this.email = null
      this.isAuthenticated = false
    }
  }
}) 