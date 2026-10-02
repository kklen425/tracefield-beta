from reportlab.pdfgen import canvas
from PIL import Image
from pathlib import Path
p=Path('qa-output')
for ext in ['png','jpg','webp']:
 im=Image.new('RGB',(640,480),(72,91,84))
 if ext=='jpg':
  exif=Image.Exif();exif[305]='TRACEFIELD QA';exif[315]='Disposable test author';im.save(p/f'fixture.{ext}',exif=exif)
 else:im.save(p/f'fixture.{ext}')
Image.new('RGB',(4000,3000),(130,120,100)).save(p/'large.jpg')
c=canvas.Canvas(str(p/'text.pdf'));c.setTitle('TRACEFIELD QA document');c.setAuthor('Disposable fixture');
for n in range(3):
 c.drawString(40,790,f'Page {n+1}: This passage tests local extraction of selectable text.')
 c.drawString(40,760,'Furthermore, evidence must be distinguished from a claim of certainty.')
 c.showPage()
c.save()
c=canvas.Canvas(str(p/'scanned.pdf'));c.drawImage(str(p/'fixture.png'),40,400,width=320,height=240);c.save()
(p/'corrupt.pdf').write_bytes(b'%PDF-1.7\ninvalid')
(p/'unsupported.txt').write_text('Unsupported image input')
