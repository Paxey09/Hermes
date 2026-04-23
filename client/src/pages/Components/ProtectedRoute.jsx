import { useState, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { supabase } from "../../config/supabaseClient.js"

const ProtectedRoute = ({ children, requiredRole }) => {
    const [user, setUser] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            // Check if user is authenticated
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                setLoading(false)
                return
            }
            setUser(session.user)

            // Get user role from public.profiles table
            const { data: userData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
            setUserRole(userData?.role || null)
        } catch (error) {
            console.error('Auth check error:', error)
        } finally {
            setLoading(false)
        }
    }
    if (loading) {
      return <div>Loading...</div>
    }

    // If not authenticated, redirect to NotFound
    if (!user) {
      return <Navigate to="/NotFound" replace />
    }
    // If role is required and doesn't match, redirect to NotFound
    if (requiredRole && userRole !== requiredRole) {
      return <Navigate to="/NotFound" replace />
    }
    return children
}

export default ProtectedRoute