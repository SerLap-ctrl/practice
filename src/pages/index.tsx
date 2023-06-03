import React, { useEffect } from "react";
import PanelSection from "../../components/PanelSection";
import FooterSection from "../../components/FooterSection";
import GraphSection from "@/components/graphSection/GraphSection";

export default function Home() {
  useEffect(
      () => {
        document.title = 'Main';
      }
  );
  return (
      <>
        <PanelSection/>
        <GraphSection/>
        <FooterSection/>
      </>
  );
}