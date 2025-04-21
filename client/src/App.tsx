import "./App.css";
import Button from "./components/ui/button";

function App() {
  return (
    <>
      <Button>default</Button>
      <Button color="secondary">default</Button>
      <Button color="accent">default</Button>
      <Button color="danger">default</Button>
      <Button variant="ghost">ghost</Button>
      <Button color="secondary" variant="ghost">ghost</Button>
      <Button color="accent" variant="ghost">ghost</Button>
      <Button color="danger" variant="ghost">ghost</Button>
      <Button variant="outline">outline</Button>
      <Button color="secondary" variant="outline">outline</Button>
      <Button color="danger" variant="outline">outline</Button>
    </>
  );
}

export default App;
