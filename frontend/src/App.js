import { RouterProvider } from "react-router-dom"
import React from 'react';

import router from "./Route/router";


function App() {
  return (
    <div className="App">
      <header className="App-header">
          <RouterProvider router={router} />
      </header>
    </div>
  )
}

export default App;