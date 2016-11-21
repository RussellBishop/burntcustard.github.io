
function vertexLookup(shape) {
  
  "use strict";
  
  switch (shape) {

  // Kite shaped. Like a kite.
  case "kite":
    return [
      1, 0,
      2, 1,
      1, 3,
      0, 1
    ];
      
  // |
  case "line":
    return [
      0, 0,
      0, 1
    ];

  //   /\ 
  // <    >
  //   \/
  case "star":
    return [
      3, 0,
      4, 2,
      6, 3,
      4, 4,
      3, 6,
      2, 4,
      0, 3,
      2, 2
    ];
      
  //   /\ 
  // <    >
  //   \/
  // - But rotated 45 degrees and nearly double the size
  case "fatStar":
    return [
      0, 0,
      4, 1,
      8, 0,
      7, 4,
      8, 8,
      4, 7,
      0, 8,
      1, 4
    ];
      
  // Rocket shaped. Kinda.
  case "rocket":
    return [
      2, 0,
      4, 5,
      3, 6,
      2, 5,
      1, 6,
      0, 5
    ];
      
  // >-<=> google.co.uk/search?tbm=isch&q=vortex+howler
  case "vortexHowler":
    return [
      3, 10,
      0,  7,
      0,  3,
      3,  0,
      6,  3,
      6,  7,
      3, 10,
      3, 15,
      6, 19,
      3, 18,
      0, 19,
      3, 15
    ];
      
  // ◻
  case "square":
    return [
      0, 0,
      1, 0,
      1, 1,
      0, 1
    ];

  // △
  case "equilateralTriangle":
    return [
      4, 0,
      0, 7,
      8, 7
    ]; // Close enough (<1% away from being equilateral)

  // ◺
  case "rightAngledTriangleShort":
    return [
      0, 0,
      1, 1,
      0, 1
    ];
      
  // ◺ But missing half the hypotenuse. So not a closed shape.
  case "rightAngledTriangleMouth2":
    return [
      0, 2,
      0, 0,
      1, 1
    ];
      
  // L shape with even length lines
  case "rightAngledTriangleMouth":
    return [
      0, 0,
      0, 1,
      1, 1
    ];
      
  // ◺ but taller
  case "rightAngledTriangleTall":
    return [
      0, 0,
      1, 2,
      0, 2
    ];

  // \_,_/ kinda shape
  case "bucketMouth":
    return [
       0, 0,
       2, 3,
       7, 5,
      12, 3,
      14, 0
    ];
      
  // ⬠
  case "pentagon":
    return [
      // TODO: pentagon vertices
    ];

  // ⬡
  case "hexagon":
    return [
      // TODO: hexagon vertices
    ];

  default:
    return [];

  }

}