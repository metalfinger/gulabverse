import "./App.css";
import ThreeScene from "./ThreeScene";
import ThreeScene2Camera from "./ThreeScene2Camera";
import MyShaderCanvas from "./MyShaderCanvas";
import ThreeScene2CameraLayers from "./ThreeScene2CameraLayers";

function App() {
  return (
    <div className="App">
      <div className="canvasholder">
        <MyShaderCanvas />
        {/* <ThreeScene /> */}
        <ThreeScene2CameraLayers />
      </div>
    </div>
  );
}

export default App;
