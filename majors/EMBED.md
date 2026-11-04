# Embedding the major search

Once GitHub Pages is on, the app lives at
`https://sophiasfarrell.github.io/majors/`

Paste this into the CMS (an "HTML/embed" block):

```html
<iframe id="majors-embed" src="https://sophiasfarrell.github.io/majors/"
        title="Search enrollment trends by major" width="100%" height="900"
        style="border:0;max-width:900px" loading="lazy"></iframe>
<script>
  // Lets the app resize the frame so readers never see a second scrollbar.
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'majors-embed-height') {
      document.getElementById('majors-embed').style.height = e.data.height + 'px';
    }
  });
</script>
```

If the CMS strips `<script>`, the iframe still works; it just stays at a fixed height.

Link straight to a major: add `?m=journalism` (comma-separate up to four).

Updating data: run the conversion script against a new spreadsheet to rewrite `majors/data.json`.
