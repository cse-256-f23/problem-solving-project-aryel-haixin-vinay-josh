// ---- Define your dialogs  and panels here ----
let panel = define_new_effective_permissions("panel", true, null)

//create heading and instructions
let permissions_title = document.createElement('b')
permissions_title.append("Permissions")
$('#sidepanel').append(permissions_title)
$('#sidepanel').append(document.createElement('br'))

$('#sidepanel').append("Select a user below and click a file on the left to check permissions")

//add panel, set attributes, and add user select button
$('#sidepanel').append(panel)
$('#panel').attr('filepath', '/C')

let new_user = define_new_user_select_field("new_user", "Select User", function(selected_user){
    $('#panel').attr('username', selected_user)
})
$('#sidepanel').append(new_user)

let new_dialog = define_new_dialog('new_dialog', '')

$('.perm_info').click(function(){
    //open and empty dialog of prev info
    new_dialog.dialog('open')
    $('#new_dialog').empty()

    // get the panel filepath, user, permission name, and if it is allowed
    let my_file_obj = path_to_file[$('#panel').attr('filepath')]
    let username = all_users[$('#panel').attr('username')]
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
})


// ---- Display file structure ----

// (recursively) makes and returns an html element (wrapped in a jquery object) for a given file object
function make_file_element(file_obj) {
    let file_hash = get_full_path(file_obj)

    if(file_obj.is_folder) {
        let folder_elem = $(`<div class='folder' id="${file_hash}_div">
            <h3 id="${file_hash}_header">
                <span class="oi oi-folder" id="${file_hash}_icon"/> ${file_obj.filename} 
                <button class="ui-button ui-widget ui-corner-all permbutton" path="${file_hash}" id="${file_hash}_permbutton"> 
                    <span class="oi oi-lock-unlocked" id="${file_hash}_permicon"/> 
                </button>
            </h3>
        </div>`)

        // append children, if any:
        if( file_hash in parent_to_children) {
            let container_elem = $("<div class='folder_contents'></div>")
            folder_elem.append(container_elem)
            for(child_file of parent_to_children[file_hash]) {
                let child_elem = make_file_element(child_file)
                container_elem.append(child_elem)
            }
        }
        return folder_elem
    }
    else {
        return $(`<div class='file'  id="${file_hash}_div">
            <span class="oi oi-file" id="${file_hash}_icon"/> ${file_obj.filename}
            <button class="ui-button ui-widget ui-corner-all permbutton" path="${file_hash}" id="${file_hash}_permbutton"> 
                <span class="oi oi-lock-unlocked" id="${file_hash}_permicon"/> 
            </button>
        </div>`)
    }
}

for(let root_file of root_files) {
    let file_elem = make_file_element(root_file)
    $( "#filestructure" ).append( file_elem);    
}



// make folder hierarchy into an accordion structure
$('.folder').accordion({
    collapsible: true,
    heightStyle: 'content'
}) // TODO: start collapsed and check whether read permission exists before expanding?


// -- Connect File Structure lock buttons to the permission dialog --

// open permissions dialog when a permission button is clicked
$('.permbutton').click( function( e ) {
    // Set the path and open dialog:
    let path = e.currentTarget.getAttribute('path');
    perm_dialog.attr('filepath', path)
    perm_dialog.dialog('open')
    //open_permissions_dialog(path)

    // Deal with the fact that folders try to collapse/expand when you click on their permissions button:
    e.stopPropagation() // don't propagate button click to element underneath it (e.g. folder accordion)
    // Emit a click for logging purposes:
    emitter.dispatchEvent(new CustomEvent('userEvent', { detail: new ClickEntry(ActionEnum.CLICK, (e.clientX + window.pageXOffset), (e.clientY + window.pageYOffset), e.target.id,new Date().getTime()) }))
});



// ---- Assign unique ids to everything that doesn't have an ID ----
$('#html-loc').find('*').uniqueId() 

