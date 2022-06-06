import './App.css';
import PlotByDay from './plots/PlotByDay';
import { Data } from "./data/Data";

function App() {
  return (
    <PlotByDay data={new Data()} />
  );
}

export default App;
