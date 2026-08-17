import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PersonalizationOnboarding from "./PersonalizationOnboarding";
import { loadPrefs } from "@/lib/personalization";

const PersonalizationGate = ({ ready }: { ready: boolean }) => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (ready && !loadPrefs()) setShow(true);
  }, [ready]);

  if (!show) return null;

  return (
    <PersonalizationOnboarding
      onDone={() => {
        setShow(false);
        navigate("/#for-you", { replace: true });
      }}
    />
  );
};

export default PersonalizationGate;
