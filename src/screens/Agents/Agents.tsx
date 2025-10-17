import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const Agents = (): JSX.Element => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/ai-tools", { replace: true });
  }, [navigate]);
  return <></>;
};

export default Agents;
