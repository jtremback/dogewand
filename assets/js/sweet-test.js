let str = macro {
    case {_ $template } => {
        var temp = #{$template}[0];
        var tempString = temp.token.value.raw;
        letstx $newTemp = [makeValue(tempString, #{here})];
        return #{$newTemp}
    }
}

var arf = "harpoon";

var poopen = str `

<div class="poopen">
  <span class="scoopen">{{froopen}}</span>
</div>
<froopen></froopen>

`

