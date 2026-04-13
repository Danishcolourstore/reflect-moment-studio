import { useNavigate } from "react-router-dom";
import GridBuilder from "@/components/grid-builder/GridBuilder";

export default function BuilderTest() {
  const navigate = useNavigate();
  return <GridBuilder onClose={() => navigate("/home")} />;
}
