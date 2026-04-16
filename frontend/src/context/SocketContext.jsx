import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!token || !user) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setConnected(false)
      return
    }

    const socket = io('/', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      setConnected(true)
      console.log('🟢 Socket connected:', socket.id)
    })
    socket.on('disconnect', () => {
      setConnected(false)
      console.log('🔴 Socket disconnected')
    })
    socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message)
    })

    // Global toast notifications
    if (user.role === 'patient') {
      socket.on('near_turn_alert', ({ message }) => {
        toast.success(`🔔 ${message}`, { duration: 7000, id: 'near-turn' })
      })
    }

    if (['doctor', 'receptionist'].includes(user.role)) {
      socket.on('emergency_alert', ({ message }) => {
        toast.error(`🚨 ${message}`, { duration: 8000 })
      })
      socket.on('new_appointment', ({ department }) => {
        toast(`📋 New patient in ${department}`, { icon: '🏥', duration: 4000 })
      })
    }

    if (user.role === 'doctor') {
      socket.on('doctor_assigned', ({ appointment }) => {
        const name = appointment.patient?.name || appointment.patientName || 'Patient'
        toast.success(`👤 ${name} assigned to you (Token #${appointment.tokenNumber})`, { duration: 6000 })
      })
    }

    socketRef.current = socket
    return () => { socket.disconnect(); socketRef.current = null }
  }, [token, user?._id])

  // ── Room helpers ─────────────────────────────────────────────────────────────
  const joinDeptRoom = (hospitalId, department) => {
    socketRef.current?.emit('join_department_room', { hospitalId, department })
  }
  const leaveDeptRoom = (hospitalId, department) => {
    socketRef.current?.emit('leave_department_room', { hospitalId, department })
  }

  // Generic event subscription — returns cleanup fn
  const on = (event, cb) => {
    socketRef.current?.on(event, cb)
    return () => socketRef.current?.off(event, cb)
  }

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, joinDeptRoom, leaveDeptRoom, on }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
