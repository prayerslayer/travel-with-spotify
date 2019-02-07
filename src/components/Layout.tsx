import styled from "styled-components";

export const Page = styled.section`
  width: 100vw;
  height: 100vh;
  display: flex;
`;

export const CenteredInPage = styled(Page)`
  align-items: center;
  justify-content: center;
`;

export const Row = styled.section`
  display: flex;
  flex-direction: row;
`;

export const Button = styled.button`
  background: transparent;
  border: 2px solid lightcoral;
  cursor: pointer;
  color: lightcoral;
  margin: 0 1em;
  padding: 0.25em 1em;

  :hover {
    border-color: crimson;
    color: crimson;
  }
`;

export const LargeButton = styled(Button)`
  font-size: 2rem;
`;

export const Heading = styled.h3`
  margin-top: 0;
  margin-bottom: 25px;
  font-size: 1.25rem;
`;

export const Paragraph = styled.p`
  max-width: 600px;
  margin-top: 0;
`;
