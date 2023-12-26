class DTOFactory {
  createUserDTO(user) {
    console.log("User data:", user);
    return new UserDTO(user);
  }
}

export default DTOFactory;
