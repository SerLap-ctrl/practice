import React, { useEffect } from "react";
import PanelSection from "../../components/MainPage/PanelSection";
import GraphSection from "../../components/MainPage/GraphSection";
import FooterSection from "../../components/MainPage/FooterSection";
import dynamic from 'next/dynamic';


export default function Home() {
  useEffect(
      () => {
        document.title = 'Main';
      }
  );

  return (
      <>
        <PanelSection></PanelSection>
        <GraphSection></GraphSection>
        <FooterSection></FooterSection>
      </>
  );
}