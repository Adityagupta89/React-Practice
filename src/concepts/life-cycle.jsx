import { useEffect, useLayoutEffect, useState, useRef } from "react";

/*
========================================
REACT FLOW
========================================

1. RENDER PHASE
   - React calls component function
   - variables initialize
   - normal functions are created
   - JSX is prepared
   - no DOM update yet

2. COMMIT PHASE
   - React updates the real DOM

3. EFFECT PHASE
   - useEffect runs after paint
   - useLayoutEffect runs after DOM update but before paint

4. CLEANUP
   - return inside useEffect is cleanup
   - runs before next effect if dependency changed
   - also runs on unmount
*/


/*
========================================
1) RENDER PHASE + JSX VS EFFECT ORDER
========================================
*/
function RenderVsEffectOrder() {
  const [state, setState] = useState("2");

  function getMessage() {
    console.log("getMessage called");
    return "Welcome";
  }

  console.log("render start, state =", state);

  useEffect(() => {
    console.log("effect 1 called -> updating state to 4");
    setState("4");
  }, []);

  useEffect(() => {
    console.log("effect 2 called");
  }, []);

  return <h1>{getMessage()}</h1>;
}

/*
Flow on first mount:
1. render start, state = 2
2. getMessage called
3. JSX returned -> <h1>Welcome</h1>
4. DOM updates
5. effect 1 called -> updating state to 4
6. effect 2 called
7. component renders again because state updated
8. render start, state = 4
9. getMessage called
10. DOM updates

Important:
- getMessage runs during render phase
- useEffect runs later
- setState inside effect does NOT update state immediately in same render
- new state is available in next render
*/


/*
========================================
2) CLEANUP + ONE DEPENDENCY
========================================
*/
function ChatRoom({ roomId }) {
  console.log("render room:", roomId);

  useEffect(() => {
    console.log("connect:", roomId);

    return () => {
      console.log("disconnect:", roomId);
    };
  }, [roomId]);

  return <div>Room: {roomId}</div>;
}

/*
Flow:
Initial:
1. render room: general
2. DOM updates
3. connect: general

If roomId changes to music:
1. render room: music
2. DOM updates
3. cleanup old effect -> disconnect: general
4. new effect -> connect: music
*/


/*
========================================
3) MISSING FUNCTION DEPENDENCY -> STALE BUG
========================================
*/
function StaleFunctionBug() {
  const [count, setCount] = useState(0);

  const logCount = () => {
    console.log("count inside interval:", count);
  };

  useEffect(() => {
    const id = setInterval(() => {
      logCount();
    }, 2000);

    return () => clearInterval(id);
  }, []); // wrong on purpose

  return <button onClick={() => setCount(count + 1)}>Count {count}</button>;
}

/*
Bug:
- effect runs only once
- interval keeps old logCount
- old logCount remembers old count
- UI becomes 1,2,3 but interval may still log 0

Why:
function created during first render was captured by effect
*/


/*
========================================
4) STRICT MODE TIMER EXAMPLE
========================================
*/
function StrictModeTimer() {
  useEffect(() => {
    console.log("effect setup");

    const id = setInterval(() => {
      console.log("tick");
    }, 1000);

    return () => {
      console.log("cleanup interval");
      clearInterval(id);
    };
  }, []);

  return <div>Timer</div>;
}

/*
In Strict Mode (development):
- component may mount twice for checking
- effect setup
- cleanup
- effect setup again

Without cleanup:
- multiple intervals can run
- duplicate logs happen

Strict Mode helps catch missing cleanup bugs
*/


/*
========================================
5) WRONG DERIVED STATE EXAMPLE
========================================
*/
function WrongFilteredList({ items }) {
  const [activeItems, setActiveItems] = useState([]);

  useEffect(() => {
    console.log("filtering items inside effect");
    const filtered = items.filter((item) => item.active);
    setActiveItems(filtered);
  }, [items]);

  return (
    <ul>
      {activeItems.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}

/*
Why wrong:
- items comes as props
- component renders first with old/empty activeItems
- DOM updates
- effect runs
- setActiveItems triggers one more render
- extra render is unnecessary

Flow:
1. render with activeItems = []
2. DOM updates
3. effect filters items
4. setActiveItems(...)
5. render again with filtered list

Problem:
derived UI data should not be stored in extra state
*/


/*
========================================
6) CORRECT DERIVED STATE EXAMPLE
========================================
*/
function CorrectFilteredList({ items }) {
  const activeItems = items.filter((item) => item.active);

  return (
    <ul>
      {activeItems.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}

/*
Why correct:
- no extra state
- no extra effect
- no extra render
- derived value is calculated directly during render

Best practice:
if data can be calculated from props/state, calculate it in render
do not put it in useEffect + useState
*/


/*
========================================
7) useEffect vs useLayoutEffect
========================================
*/
function LayoutVsEffect() {
  const ref = useRef(null);

  console.log("render LayoutVsEffect");

  useLayoutEffect(() => {
    console.log("useLayoutEffect runs before paint");
    const rect = ref.current.getBoundingClientRect();
    console.log("measured width:", rect.width);
  }, []);

  useEffect(() => {
    console.log("useEffect runs after paint");
  }, []);

  return <div ref={ref}>Measure Me</div>;
}

/*
Flow:
1. render LayoutVsEffect
2. DOM updates
3. useLayoutEffect runs
4. browser paints
5. useEffect runs

Use useEffect:
- API calls
- subscriptions
- timers
- logging

Use useLayoutEffect:
- measure DOM
- set scroll position before paint
- avoid flicker
- tooltip/modal positioning
*/