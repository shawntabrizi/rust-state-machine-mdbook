
<div class="content-row">
<div class="content-col">

{{#include ./template/README.md}}

</div>

<div class="content-col">

<div class="tab">
  <button class="maintab tablinks active" onclick="switchMainTab(event, 'Template')">Template</button>
  <button class="maintab tablinks" onclick="switchMainTab(event, 'Solution')">Solution</button>
  <button class="maintab tablinks" onclick="switchMainTab(event, 'Diff')">Diff</button>
</div>

<div id="Template" class="maintab tabcontent active">

<div class="tab">
<button class="subtab tablinks file-template file-modified active" onclick="switchSubTab(event, 'src/balances.rs')" data-id="src/balances.rs">src/balances.rs</button>
<button class="subtab tablinks file-template file-modified" onclick="switchSubTab(event, 'src/main.rs')" data-id="src/main.rs">src/main.rs</button>
<button class="subtab tablinks file-template file-added" onclick="switchSubTab(event, 'src/support.rs')" data-id="src/support.rs">src/support.rs</button>
</div>
<div id="template/src/balances.rs" class="subtab tabcontent active" data-id="src/balances.rs">

```rust
{{#include ./template/src/balances.rs}}
```

</div>

<div id="template/src/main.rs" class="subtab tabcontent" data-id="src/main.rs">

```rust
{{#include ./template/src/main.rs}}
```

</div>

<div id="template/src/support.rs" class="subtab tabcontent" data-id="src/support.rs">

```rust
{{#include ./template/src/support.rs}}
```

</div>



</div>

<div id="Solution" class="maintab tabcontent">

<div class="tab">
<button class="subtab tablinks file-solution file-modified active" onclick="switchSubTab(event, 'src/balances.rs')" data-id="src/balances.rs">src/balances.rs</button>
<button class="subtab tablinks file-solution file-modified" onclick="switchSubTab(event, 'src/main.rs')" data-id="src/main.rs">src/main.rs</button>
</div>
<div id="solution/src/balances.rs" class="subtab tabcontent active" data-id="src/balances.rs">

```rust
{{#include ./solution/src/balances.rs}}
```

</div>

<div id="solution/src/main.rs" class="subtab tabcontent" data-id="src/main.rs">

```rust
{{#include ./solution/src/main.rs}}
```

</div>



</div>

<div id="Diff" class="maintab tabcontent">


<div class="tab">
	<button class="subtab tablinks active" onclick="switchSubTab(event, 'template.diff')">template.diff</button>
	<button class="subtab tablinks" onclick="switchSubTab(event, 'solution.diff')">solution.diff</button>
</div>
<div id="template.diff" class="subtab tabcontent active" data-id="template.diff">

```diff
{{#include ./template/template.diff}}
```

</div>
<div id="solution.diff" class="subtab tabcontent" data-id="solution.diff">

```diff
{{#include ./solution/solution.diff}}
```

</div>

</div>

</div>
</div>
