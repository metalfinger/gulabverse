import React, { useState, useEffect } from "react";
import Planet1 from "./Planet1";
import Planet3 from "./Planet3";
import Planet5 from "./Planet5";
import Planet6 from "./Planet6";
import gsap from "gsap";

function Galaxy() {
  //when clicked
  function handleClick() {}

  return (
    <div className="galaxy" onClick={handleClick}>
      <Planet1 />
      <Planet3 />
      <Planet5 />
      <Planet6 />
    </div>
  );
}

export default Galaxy;
