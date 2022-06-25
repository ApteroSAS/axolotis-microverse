import Cookies from 'js-cookie'

window.setAdmin = ()=>{
    Cookies.set('admin', true);
    alert("you are an admin");
}

window.unsetAdmin = ()=>{
    Cookies.set('admin', false);
    alert("you are a sbire");
}