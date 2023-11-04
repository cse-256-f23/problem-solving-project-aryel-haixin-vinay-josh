// ---- Define your dialogs  and panels here ----

//count for the number of panels, so that the ids are different
let panelCount = 0;

//create heading and instructions
let permissions_title = document.createElement('b')
permissions_title.append("Permissions")
$('#sidepanel').append(permissions_title)
$('#sidepanel').append(document.createElement('br'))
$('#sidepanel').append("Select a user below and click a file on the left to check permissions. Another panel can be opened by clicking the 'Create New Panel' Button below. The two panels will be set to the same file, but the user can be changed to compare their permissions.")

//create new permissions panel button
let newPermissionsPanelButton = document.createElement('button')
newPermissionsPanelButton.id = "newPermissionsPanelButton"
newPermissionsPanelButton.textContent = "Create New Panel"
$('#sidepanel').append(newPermissionsPanelButton)

// Add permissions word to button
$('permbutton').append("File Permissions");

//add panel, set attributes, and add user select button
function createNewPermissionsPanel() {
    panelCount++;
    let panel = define_new_effective_permissions("panel" + panelCount, true, null)
    $('#sidepanel').append(panel)

    let new_user = define_new_user_select_field("new_user", "Select User", function (selected_user) {
        $('#panel').attr('username', selected_user)
    })
    $('#sidepanel').append(new_user)

    let new_dialog = define_new_dialog('new_dialog', '')

    $('.perm_info').click(function () {
        //open and empty dialog of prev info
        new_dialog.dialog('open')
        $('#new_dialog').empty()

        // get the panel filepath, user, permission name, and if it is allowed
        let my_file_obj = path_to_file[$('#panel' + panelCount).attr('filepath')]
        let username = all_users[$('#panel' + panelCount).attr('username')]
        let perm_attribute = this.getAttribute("permission_name")
        let display_user = allow_user_action(my_file_obj, username, perm_attribute, true)

        //get and add the permission name and if it is allowed to the panel
        let permission_append_title = document.createElement('b')
        permission_append_title.append("Permission Name: ")
        let permission_append_name = document.createElement('p')
        permission_append_name.append(perm_attribute)

        let allowed_append_title = document.createElement('b')
        allowed_append_title.append("Access Allowed: ")
        let allowed_append_name = document.createElement('p')
        allowed_append_name.append(display_user.is_allowed)

        new_dialog.append(permission_append_title, permission_append_name);
        new_dialog.append(allowed_append_title, allowed_append_name);

        //add the explanation text
        let explanation_append_title = document.createElement('b')
        explanation_append_title.append("Explanation: ")
        $('#new_dialog').append(get_explanation_text(display_user))

        //add spacing
        $('#sidepanel').append(document.createElement('br'))
    })
}



//button click function
$('#newPermissionsPanelButton').click(function () {
    createNewPermissionsPanel()
})
//initialize the first panel
createNewPermissionsPanel()

//click on a file to set the filepath for the panels
$(document).on('click', '.file', function () {
    //get filepath by removing the _div from the id
    let filepath = $(this).attr('id').slice(0, -4);
    console.log(filepath)
    for (let i = 0; i < panelCount; ++i) {
        //set each panel's filepath
        $('#panel' + panelCount).attr('filepath', filepath)
    }
});


// ---- Display file structure ----

// (recursively) makes and returns an html element (wrapped in a jquery object) for a given file object
function make_file_element(file_obj) {
    let file_hash = get_full_path(file_obj)

    if (file_obj.is_folder) {
        let folder_elem = $(`<div class='folder' id="${file_hash}_div">
            <h3 id="${file_hash}_header">
                <span class="oi oi-folder" id="${file_hash}_icon"/> 
                <div class="tooltip">
                ${file_obj.filename} 
                <span class="fileName tooltipText"></span>
             </div>
                <span class="tooltip">
                    <button class="ui-button ui-widget ui-corner-all permbutton" path="${file_hash}" id="${file_hash}_permbutton"> 
                        <span class="oi oi-lock-unlocked" id="${file_hash}_permicon"/> 
                    </button>
                    <span class="tooltipText" />
                </span>
            </h3>
        </div>`)

        // append children, if any:
        if (file_hash in parent_to_children) {
            let container_elem = $("<div class='folder_contents'></div>")
            folder_elem.append(container_elem)
            for (child_file of parent_to_children[file_hash]) {
                let child_elem = make_file_element(child_file)
                container_elem.append(child_elem)
            }
        }
        return folder_elem
    }
    else {
        return $(`<div class='file'  id="${file_hash}_div">
            <span class="oi oi-file" id="${file_hash}_icon"/>
            <div class="tooltip">
             ${file_obj.filename}
             <span class="fileName tooltipText"></span>
             </div>
                </div>
        <div class="tooltip">
            <button class="ui-button ui-widget ui-corner-all permbutton" path="${file_hash}" id="${file_hash}_permbutton"> 
                <span class="oi oi-lock-unlocked" id="${file_hash}_permicon"/> 
            </button>
            <span class="tooltipText"></span>
        </div>`)
    }
}

for (let root_file of root_files) {
    let file_elem = make_file_element(root_file)
    $("#filestructure").append(file_elem);
}



// make folder hierarchy into an accordion structure
$('.folder').accordion({
    collapsible: true,
    heightStyle: 'content'
}) // TODO: start collapsed and check whether read permission exists before expanding?


// -- Connect File Structure lock buttons to the permission dialog --

// open permissions dialog when a permission button is clicked
$('.permbutton').click(function (e) {
    // Set the path and open dialog:
    let path = e.currentTarget.getAttribute('path');
    perm_dialog.attr('filepath', path)
    perm_dialog.dialog('open')
    //open_permissions_dialog(path)

    // Deal with the fact that folders try to collapse/expand when you click on their permissions button:
    e.stopPropagation() // don't propagate button click to element underneath it (e.g. folder accordion)
    // Emit a click for logging purposes:
    emitter.dispatchEvent(new CustomEvent('userEvent', { detail: new ClickEntry(ActionEnum.CLICK, (e.clientX + window.pageXOffset), (e.clientY + window.pageYOffset), e.target.id, new Date().getTime()) }))
});


$('.tooltipText').html("Click to Change Permission")
$('.fileName').html("Click to View Permission on the Right")
$('.individual').html("click to check reasons for the given permission")

// $('.permbutton').addClass("tooltip")


// ---- Assign unique ids to everything that doesn't have an ID ----
$('#html-loc').find('*').uniqueId()

// The "Are you sure Panel"
function createConfirmationDialog(confirmCallback) {
    let confirmationDialog = $("<div></div>")
        .html("Are you sure?")
        .dialog({
            autoOpen: false,
            modal: true,
            buttons: {
                "Yes": function () {
                    $(this).dialog("close");
                    confirmCallback(); // Call the callback function if the user clicks "Yes"
                },
                "No": function () {
                    $(this).dialog("close");
                    // You can add additional handling or leave it empty
                }
            }
        });

    return confirmationDialog;
}
$('.____idk').click(function () {
    //Setting the path file and dialog
    confirmDialog.dialog('open');
    confirmDialog.data('confirmCallback', function () {
    });
});

confirmDialog.dialog({
    beforeClose: function (event, ui) {
        let confirmCallback = confirmDialog.data('confirmCallback');
        if (confirmCallback) {
            confirmCallback();
        }
    }
});



