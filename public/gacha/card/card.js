let container = document.querySelector(".container");
let overlay = document.querySelector(".overlay");
container.addEventListener("mousemove", function (e) {
  let x = e.offsetX;
  let y = e.offsetY;
  let rotateY = (-1 / 5) * x + 20;
  let rotateX = (4 / 30) * y - 20;

  overlay.style = `background-position : ${x / 5 + y / 5}%`;
  container.style = `transform : perspective(350px)  rotateX(${rotateX}deg)  rotateY(${rotateY}deg)`;
  container.addEventListener("mouseout", function () {
    overlay.style = `filter : opacity(0)`;
    container.style = `transform : perspective(350px)
    rotateY(0deg) rotateX(0deg)`;
  });
});
