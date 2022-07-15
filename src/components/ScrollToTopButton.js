import React, { useState } from 'react';
import styled from 'styled-components';

const Button = styled.div`
  /* center bottom */
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 1em;
  /* make it round and small */
  width: 40px;
  height: 40px;
  text-align: center;
  font-size: 22px;
  padding: 5px;
  /* colors */
  border: 1px solid white;
  border-radius: 50%;
  background-color: #673ab7;
  color: white;
  /* other */
  cursor: pointer;
  z-index: 1;
`;

const MIN_SCROLL_TO_REVEAL = 300;

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  const toggleVisible = () => {
    const scrolled = document.documentElement.scrollTop;
    if (scrolled > MIN_SCROLL_TO_REVEAL) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
      /* you can also use 'auto' behaviour
         in place of 'smooth' */
    });
  };

  window.addEventListener('scroll', toggleVisible);

  return (
    <Button style={{ display: visible ? 'inline' : 'none' }}>
      <span onClick={scrollToTop}>⬆</span>
    </Button>
  );
};

export default ScrollToTopButton;
