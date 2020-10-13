<div class="fill pad">
	<div style="border:1px solid #ccc" id="aco-canvas"></div>

    <div class="hr vpad"></div>
    <div>
        <table>
            <tr>
                <td colspan="2"><b>Debug Info</b></td>
            </tr>
            <tr style="display:none;" class="aco-info">
                <td>Interation: </td><td id="iteration-info"></td>
            </tr>
            <tr style="display:none;" class="aco-info">
                <td>Best Distance: </td><td id="best-distance"></td>
            </tr>
            <tr id="aco-buttons">
                <td colspan="2"><button id="start-search-btn">Start</button> <button id="clear-graph">Clear</button></td>
            </tr>
        </table>
        <br />
        <table id="aco-params">
            <tr>
                <td colspan="2"><b>Configuration</b></td>
            </tr>
            <tr>
                <td>ACO Mode: </td>
                <td>
                    <select id="aco-mode">
                        <option value="acs">ACS</option>
                        <option value="elitist">Elitist</option>
                        <option value="maxmin" selected="selected">Max-Min</option>
                    </select>
                </td>
            </tr>
