// Réduit une image côté navigateur avant envoi (aucune dépendance, juste
// l'API Canvas native) — une photo de profil n'a jamais besoin d'être plus
// grande que quelques centaines de Ko, même si la photo d'origine (venant
// d'un téléphone) pèse plusieurs dizaines de Mo.
const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.82;

export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression impossible"));
            return;
          }
          resolve(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image illisible"));
    };

    img.src = objectUrl;
  });
}
