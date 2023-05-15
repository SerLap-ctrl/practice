import React, { useEffect } from "react";
import PanelSection from "../../components/MainPage/PanelSection";
//import Diagram from "../../components/MainPage/Diagram";
import GraphSection from "../../components/MainPage/GraphSection"
import FooterSection from "../../components/MainPage/FooterSection";
import dynamic from 'next/dynamic';
import App from "@/components/MainPage/GraphSection";



export default function Home() {
  useEffect(
      () => {
        document.title = 'Main';
      }
  );

  return (
      <>
        <PanelSection></PanelSection>
        <App></App>
        <FooterSection></FooterSection>
      </>
  );
}