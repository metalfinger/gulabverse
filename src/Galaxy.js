import React, { useState, useEffect } from "react";
import Planet1 from "./Planet1";
import Planet2 from "./Planet2";
import Planet3 from "./Planet3";
import Planet4 from "./Planet4";
import Planet5 from "./Planet5";
import Planet6 from "./Planet6";

function Galaxy() {
  //when clicked
  function handleClick() {}

  return (
    <div className="galaxy" onClick={handleClick}>
      <Planet1 />
      <Planet2 />
      <Planet3 />
      <Planet4 />
      <Planet5 />
      <Planet6 />
    </div>
  );
}

export default Galaxy;
