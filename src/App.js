import "./App.css";
import MyShaderCanvas from "./MyShaderCanvas";
import Galaxy from "./Galaxy";

function App() {
  return (
    <div className="App">
      <div className="canvasholder">
        <MyShaderCanvas />
      </div>
      <Galaxy />
    </div>
  );
}

export default App;
