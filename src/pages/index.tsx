import React, { useEffect } from "react";
import PanelSection from "../../components/PanelSection";
import FooterSection from "../../components/FooterSection";
import GraphSection from "@/components/GraphSection";
import {index} from '@/store'
import {Provider} from "react-redux";

export default function Home() {
  useEffect(
      () => {
        document.title = 'Main';
      }
  );
  return (
      <Provider store={index}>
        <PanelSection/>
        <GraphSection/>
        <FooterSection/>
      </Provider>
  );
}