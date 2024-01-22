
<div class="content-row">
<div class="content-col">

{{#include ./source/README.md}}

</div>
<div class="content-col">

<div class="tab">
  <button class="maintab tablinks active" onclick="switchMainTab(event, 'Source')">Source</button>
  <button class="maintab tablinks" onclick="switchMainTab(event, 'Diff')">Diff</button>
</div>

<div id="Source" class="maintab tabcontent active">

<div class="tab">
<button class="subtab tablinks file-source file-modified active" onclick="switchSubTab(event, 'Cargo.toml')" data-id="Cargo.toml">Cargo.toml</button>
</div>
<div id="source/Cargo.toml" class="subtab tabcontent active" data-id="Cargo.toml">

```toml
{{#include ./source/Cargo.toml}}
```

</div>



</div>

<div id="Diff" class="maintab tabcontent">


<div class="tab">
	<button class="subtab tablinks active" onclick="switchSubTab(event, 'changes.diff')">changes.diff</button>
</div>
<div id="changes.diff" class="subtab tabcontent active" data-id="changes.diff">

```diff
{{#include ./source/changes.diff}}
```

</div>

</div>

</div>
</div>
