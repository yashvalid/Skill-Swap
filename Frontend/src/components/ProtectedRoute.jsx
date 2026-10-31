import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchUser = async () => {
            try {
                const response = await api.get('/users/profile');
                if (response.status < 200 || response.status >= 300) {
                    navigate('/login');
                }
            } catch (err) {
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [token, navigate]);

    if (loading) {
        return (
            <div className="max-w-[1280px] mx-auto px-6 py-16 space-y-6">
                <div className="h-8 w-64 skeleton-shimmer" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-40 skeleton-shimmer" />
                    <div className="h-40 skeleton-shimmer" />
                    <div className="h-40 skeleton-shimmer" />
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;