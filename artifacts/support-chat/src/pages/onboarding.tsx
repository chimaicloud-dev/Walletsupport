import { useEffect } from "react";
import { useLocation } from "wouter";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/inbox");
  }, [setLocation]);

  return null;
}
