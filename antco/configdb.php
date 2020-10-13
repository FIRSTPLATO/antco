<?php
	@session_start();
	$_SESSION['judul'] = 'ANTCO';
	$_SESSION['welcome'] = 'Aplikasi pencarian rute dengan Ant Colony dan GMap';
	$_SESSION['by'] = 'FIRSTPLATO';
	$mysqli = new mysqli('localhost','root','','antco');
	if($mysqli->connect_errno){
		echo $mysqli->connect_errno." - ".$mysqli->connect_error;
		exit();
	}
?>
