import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Loader } from 'lucide-react'

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!token)
            navigate('/login')

        const fetchUser = async () => {
            try {
                const response = await api.get('/users/profile');
                if (response.status !== 201)
                    navigate('/login');
            } catch (err) {
                navigate('/login')
            }
            finally {
                setLoading(false);
            }
        }
        fetchUser();
    }, [token, navigate])

    if (loading)
        return <div className="flex items-center justify-center h-screen">
            <Loader className="w-10 h-10 animate-spin" />
        </div>

    return (
        children
    )
}
export default ProtectedRoute