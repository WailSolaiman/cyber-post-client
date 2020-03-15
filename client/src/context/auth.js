import React, { createContext, useReducer } from 'react'
import jwtDecode from 'jwt-decode'

const AuthContext = createContext({
  user: null,
  login: userData => {},
  logout: () => {},
})

const initialState = {
  user: null,
}

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
      }
    default:
      return state
  }
}

if (localStorage.getItem('jwtToken')) {
  const decodedToken = jwtDecode(localStorage.getItem('jwtToken'))
  console.log('decodedToken: ', decodedToken)
  if (decodedToken.exp * 1000 < Date.now()) {
    localStorage.removeItem('jwtToken')
  } else {
    initialState.user = decodedToken
  }
}

const AuthProvider = props => {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const login = userData => {
    localStorage.setItem('jwtToken', userData.token)
    console.log('login/register userData: ', userData)
    dispatch({
      type: 'LOGIN',
      payload: userData,
    })
  }
  const logout = () => {
    localStorage.removeItem('jwtToken')
    return dispatch({ type: 'LOGOUT' })
  }

  return (
    <AuthContext.Provider
      value={{ user: state.user, login, logout }}
      {...props}
    />
  )
}

export { AuthProvider, AuthContext }
