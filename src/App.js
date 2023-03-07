import './App.css';
import ThreeScene from './ThreeScene';
import MyShaderCanvas from './MyShaderCanvas';



function App() {
  return (
    <div className="App">
      <div className="canvasholder">
        
        <MyShaderCanvas />
        <ThreeScene />
      
      </div>
    </div>
  );
}

export default App;
