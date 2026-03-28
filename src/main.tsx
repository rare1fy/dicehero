import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import DiceHeroGame from './DiceHeroGame.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DiceHeroGame />
  </StrictMode>,
);
