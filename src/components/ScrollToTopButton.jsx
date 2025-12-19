import { useState } from 'react';
import styled from 'styled-components';

const Button = styled.div`
  /* center bottom */
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 1em;
  /* make it round and small */
  border-radius: 50%;
  width: 40px;
  height: 40px;
  /* background arrow */
  background-color: white;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjRweCIgaGVpZ2h0PSIyNHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xNS43NSAxMkwxMiA4LjI1TTEyIDguMjVMOC4yNSAxMk0xMiA4LjI1VjE1Ljc1TTIxLjc1IDEyQzIxLjc1IDE3LjM4NDggMTcuMzg0OCAyMS43NSAxMiAyMS43NUM2LjYxNTIyIDIxLjc1IDIuMjUgMTcuMzg0OCAyLjI1IDEyQzIuMjUgNi42MTUyMiA2LjYxNTIyIDIuMjUgMTIgMi4yNUMxNy4zODQ4IDIuMjUgMjEuNzUgNi42MTUyMiAyMS43NSAxMloiIHN0cm9rZT0iIzY3M0FCNyIgc3Ryb2tlLXdpZHRoPSIxLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K');
  background-size: contain;
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

  return <Button style={{ display: visible ? 'inline' : 'none' }} onClick={scrollToTop}></Button>;
};

export default ScrollToTopButton;
