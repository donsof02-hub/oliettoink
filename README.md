# OLIETTO INK

Sito di Olietto Ink — tatuatrice da **Sad Sakura Tattoo**, Roma, Via Tripoli 10
(Metro B · Libia), lunedì–sabato 11:00–18:00.

Online su <https://donsof02-hub.github.io/oliettoink/>

Stile: ascii · cybertribale · y2k · neosigilismo. Nero, bianco, acido.
Il menu parte al centro e si sposta in alto a sinistra al primo clic.

---

## Aggiungere foto

**Portfolio** (tatuaggi fatti) → copia i file in
`foto portfolio non compresse/`

**Flash** (disegni pronti) → copia i file in
`foto sketch pronti non compressi/`

Poi, dalla cartella del progetto:

```bash
python tools/build-media.py
```

Lo script comprime tutto e aggiorna il sito da solo. Rilancialo quando vuoi:
rifà solo le foto nuove, le altre le salta.

### Come vengono raggruppate

Legge la **data di scatto** dai metadati della foto (non la data del file, che
cambia quando la foto viene copiata o passa da WhatsApp). Le foto scattate lo
stesso giorno diventano **una sola anteprima**: cliccandola si apre il carosello
con tutte le foto di quella sessione.

Le foto **senza data nei metadati** — tipicamente screenshot PNG o file
ri-esportati — restano singole, una anteprima ciascuna, in fondo alla griglia.
Non viene mai inventata una data.

Alla fine lo script stampa l'elenco dei gruppi: è lì che si controlla se è
venuto fuori quello che volevi.

### Due cose che fa in automatico

- **Toglie i metadati** dalle foto pubblicate. Le foto da telefono contengono
  spesso le coordinate GPS di dove sono state scattate, cioè lo studio o casa.
- **Comprime**: finora da 185 MB di originali a 19 MB online, senza differenze
  visibili. Conta, perché il sito si apre quasi sempre da telefono.

Per i file `.HEIC` dell'iPhone serve una libreria in più:

```bash
pip install pillow-heif
```

---

## Cambiare il video di sfondo

Sostituisci `backgroundhomepage.MP4` e lancia:

```bash
bash tools/build-video.sh
```

Scende a 540×960 e 30 fps (il video è sfocato: più risoluzione non si vedrebbe)
e genera `media/bg.mp4` più il fotogramma di anteprima. L'originale resta intatto.

---

## Guardare il sito in locale

```bash
python -m http.server 8765
```

Poi <http://localhost:8765/>. Serve un server vero: aprendo `index.html` col
doppio clic il browser blocca il caricamento delle foto.

---

## Come è fatto

```
index.html     una pagina sola, cinque sezioni
styles.css     tutto lo stile
script.js      menu, navigazione, carosello
data/          elenchi generati: portfolio.json, flash.json, ascii.json
media/         video e foto pronti per il web (generati)
tools/         gli script qui sopra
```

Le cartelle `foto ... non compresse/` e il video originale **non finiscono su
GitHub** (vedi `.gitignore`): sono ~185 MB e il sito non li usa. Restano sul
computer, quindi tienile tu: sono la copia buona.

### Dettagli che non si vedono ma contano

- Il menu si sposta con una tecnica FLIP: si animano solo le `transform`, quindi
  il lavoro lo fa la scheda grafica e l'animazione resta fluida anche su telefoni
  vecchi.
- Chi ha attivo "riduci movimento" nel telefono trova il video fermo e le
  animazioni spente.
- Il tasto indietro del telefono funziona: ogni sezione ha il suo indirizzo
  (`#portfolio`, `#cura`…), quindi si può anche mandare il link diretto a una
  sezione.
- I testi della cura del tatuaggio sono ripresi **parola per parola** dal sito
  precedente: è una guida medica, non andava riscritta.

### Cosa manca ancora

Nella sezione **Prenota** c'è un riquadro giallo `DA COMPILARE`: acconto,
tariffa minima o oraria, età minima, politica su rinvii e disdette. Finché non
mi dici quelle cose non le scrivo, per non pubblicare condizioni inventate.
