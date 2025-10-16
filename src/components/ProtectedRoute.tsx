import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps): JSX.Element => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  if (!authService.isAuthenticated()) {
    return <></>;
  }

  return <>{children}</>;
};
